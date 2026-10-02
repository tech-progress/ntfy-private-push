FROM binwiederhier/ntfy:v2.28.0@sha256:6ef4b819f722fccdc036af611c4774cfdc2de821ab74fdd48bbf4c9d6f8973da
COPY start.sh /usr/local/bin/private-ntfy
COPY server.yml /etc/ntfy/server.yml
COPY licenses /usr/share/licenses/private-ntfy
COPY THIRD_PARTY_NOTICES.md /usr/share/licenses/private-ntfy/THIRD_PARTY_NOTICES.md
ENTRYPOINT ["sh", "/usr/local/bin/private-ntfy"]
CMD ["serve"]
