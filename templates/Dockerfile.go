# Language fragment: Go 1.22
# Appended to Dockerfile.base by the /sandbox skill. No FROM line.
# Fetches the official tarball and extracts to /usr/local, matching the
# standard Go installation convention.

RUN curl -sSL https://go.dev/dl/go1.22.0.linux-amd64.tar.gz \
        | tar -C /usr/local -xz

ENV PATH="$PATH:/usr/local/go/bin"
ENV GOPATH="/root/go"
