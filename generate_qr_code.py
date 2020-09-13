try:
    import qrcode
    import sys
    import os
    import json

    lol = sys.argv[1]
    users = json.loads(lol)
    for user in users:
        if not os.path.exists(f'./qrcodes/{user["companyid"]}'):
            os.mkdir(f'./qrcodes/{user["companyid"]}')

        img = qrcode.make(user["qrPin"])
        img.save(f'./qrcodes/{user["companyid"]}/{user["dni"]}.png')

    
     
    print(users[0])
except Exception as ex:
    print(ex)