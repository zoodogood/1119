~~Put `certificate.crt`, `ca_bundle.crt` and `private.key` here~~  
Use certbot for get files, move it here  
command: 
```bash
sudo certbot certonly --standalone
```
files: `cert.rem`, `privkey.rem`  

Maybe it's working for you?  
```bash
bun run ./run-certbot.bun.ts
```