# Certbot produksi + Docker CLI.
#
# Renewal otomatis tidak cukup: nginx menyimpan sertifikat di memori, jadi
# sertifikat baru di disk baru terpakai setelah reload. Hook deploy
# (reload-nginx.sh) memanggil `docker exec` ke container nginx, sehingga image
# ini butuh docker CLI di samping socket yang di-mount (lihat docker-compose.prod.yml).
FROM certbot/certbot:latest

RUN apk add --no-cache docker-cli

COPY reload-nginx.sh /usr/local/bin/reload-nginx.sh
RUN chmod +x /usr/local/bin/reload-nginx.sh
