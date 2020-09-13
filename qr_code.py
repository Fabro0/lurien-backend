try:
    import qrcode
    import sys
    import os

    dni = sys.argv[1]
    companyid = sys.argv[2]
    pin = sys.argv[3]


    if not os.path.exists(f'./qrcodes/{companyid}'):
        os.mkdir(f'./qrcodes/{companyid}')

    img = qrcode.make(pin)
    img.save(f'./qrcodes/{companyid}/{dni}.png')
     
    print('yes')
except Exception as ex:
    print(ex)