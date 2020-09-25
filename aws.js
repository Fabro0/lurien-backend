// Load the SDK and UUID
const AWS = require('aws-sdk');
const fs = require('fs')
const UserNew = require('./models/User.js');
AWS.config.update({ region: 'us-east-1' });

const rekognition = new AWS.Rekognition();
const s3 = new AWS.S3();

class AWSManager {
  constructor() { }
  createBucket = (BUCKET_NAME) => {
    s3.createBucket({ Bucket: BUCKET_NAME }, function (err, data) {
      if (err) console.log(err, err.stack)
      else {
        console.log('done', data.location)
      }
    })
  }

  uploadPhotoToBucket = (BUCKET_NAME) => {
    const photo_params = {
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: fileContent
    };

    s3.upload(photo_params, function (err, data) {
      if (err) {
        throw err;
      }
      console.log(`File uploaded successfully. ${data.Location}`);
    });

  }
  createCollection = (parametros) => {
    rekognition.createCollection(parametros, function (err, data) {
      if (err) console.log(err, err.stack);
      else console.log(data);
    });
  }

  deleteCollection = (parametros) => {
    rekognition.deleteCollection(parametros, function (err, data) {
      if (err) console.log(err, err.stack);
      else console.log(data);
    });
  }

  addFace = (parametros) => {
    rekognition.indexFaces(parametros, function (err, data) {
      if (err) console.log('no', err);
      else console.log('ok', data);
    });
  }

  deleteFaces = (parametros) => {
    rekognition.deleteFaces(parametros, function (err, data) {
      if (err) console.log(err, err.stack);
      else console.log(data);
    });
  }

  listCollections = (collection_params) => {
    rekognition.listCollections(collection_params, function (err, data) {
      if (err) console.log(err, err.stack);
      else console.log(data['CollectionIds']);
    });
  }

  listCollectionsAndAddFaces = (collection_params, create_params, face_list, dni, res) => {
    var faceIdArray = []
    function onlyUnique(value, index, self) {
      return self.indexOf(value) === index;
    }
    rekognition.listCollections(collection_params, function (err, data) {
      var check = false;
      if (err) {
        console.log(err)
        //return console.log({ messageError: true, data: { message: 'Error buscnaod las colecciones. Mal input/Credenciales.' } });
      }
      else {
        for (const key in data['CollectionIds']) {
          if (data['CollectionIds'].hasOwnProperty(key)) {
            const element = data['CollectionIds'][key];
            if (create_params.CollectionId == element) {
              check = true;
            }
          }
        }
        if (!check) {
          rekognition.createCollection(create_params, function (err, data) {
            if (err) {
              console.log(err)
              //return console.log({ messageError: true, data: { message: 'Error creando la colección. Credenciales/colección ya existente.' } });
            }
            else {
              face_list.forEach(face => {
                var params = {
                  CollectionId: create_params.CollectionId,
                  Image: {
                    Bytes: face
                  },
                  ExternalImageId: dni,
                  MaxFaces: 1
                };
                rekognition.indexFaces(params, async (err, data) => {
                  if (err) {
                    console.log(err)
                    //return console.log({ messageError: true, data: { message: 'Error subiendo fotos, probablemente no se reconoce la cara.' } });
                  }
                  else {
                    data['FaceRecords'].forEach(element => {
                      console.log(element['Face'].FaceId)
                      faceIdArray.push(element['Face'].FaceId)

                    })
                    await UserNew.findOne({ dni: dni }, function (err, doc) {
                      if (err) {
                        console.log(err)
                        //return console.log({ messageError: true, data: { message: 'Ni idea, pincho algo (Linea 111, aws.js)' } })
                      }
                      else {
                        var actualArray = doc.faceIds
                        for (var key in faceIdArray) {
                          actualArray.push(faceIdArray[key])
                        }
                        var finalArray = actualArray.filter(onlyUnique);
                        doc.faceIds = finalArray
                        doc.cantidadFotos = finalArray.length
                        doc.modeloEntrenado = true;
                        doc.save()
                        
                      }
                    })
                    
                  }
                });
                //return console.log({ messageError: false, data: { message: 'Fotos subidas, colección creada.' } })
              });
            }
          });
        } else {
          face_list.forEach(face => {
            var params = {
              CollectionId: create_params.CollectionId,
              Image: {
                Bytes: face
              },
              ExternalImageId: dni,
              MaxFaces: 1
            };
            rekognition.indexFaces(params, async (err, data) => {
              if (err) return console.log({ messageError: true, data: { message: 'Error subiendo fotos, probablemente no se reconoce la cara.' } });
              else {
                data['FaceRecords'].forEach(element => {
                  console.log(element['Face'].FaceId)

                  faceIdArray.push(element['Face'].FaceId)
                })
                await UserNew.findOne({ dni: dni }, function (err, doc) {
                  if (err) return console.log({ messageError: true, data: { message: 'Ni idea, pincho algo (Linea 111, aws.js)' } })
                  else {
                    var actualArray = doc.faceIds
                    for (var key in faceIdArray) {
                      actualArray.push(faceIdArray[key])
                    }
                    var finalArray = actualArray.filter(onlyUnique);
                    doc.faceIds = finalArray
                    doc.cantidadFotos = actualArray.length
                    doc.modeloEntrenado = true;
                    doc.save()
                    
                  }
                })
                return console.log({ messageError: false, data: { message: 'Fotos subidas, colección creada.' } })
              }
            });
          });
        }
      }
    });

  }

  listFaces = (faces_params) => {
    rekognition.listFaces(faces_params, function (err, data) {
      if (err) console.log(err, err.stack);
      else console.log(data);
    });
  }

  searchByImage = (parametros) => {
    rekognition.searchFacesByImage(parametros, function (err, data) {
      if (err) console.log(err, err.stack);
      else console.log(data);
    });
  }

}
const manager = new AWSManager()
module.exports = manager