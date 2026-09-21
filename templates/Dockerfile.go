# Language fragment: Go 1.27.1
# Appended to Dockerfile.base by the /sandbox skill. No FROM line.
# Fetches the official tarball, verifies its checksum, and extracts to
# /usr/local, matching the standard Go installation convention.
# Version and checksum verified live against https://go.dev/dl/?mode=json
# on 2026-09-20; bump both together when updating.
#
# Installing to /usr/local needs root: Dockerfile.base ends on the
# non-root "sandbox" user before fragments are appended (SKILL.md Phase 4
# concatenates them after the whole base file, including its USER/
# ENTRYPOINT lines), so this fragment switches back to root for the
# install and returns to sandbox afterward.
USER root
RUN curl -fsSL -o /tmp/go.tar.gz https://go.dev/dl/go1.27.1.linux-amd64.tar.gz \
    && echo "63d339f0da5ab53635a56f2490a7984dfe12dfcff22ad749f63edaf590168445  /tmp/go.tar.gz" | sha256sum -c - \
    && tar -C /usr/local -xzf /tmp/go.tar.gz \
    && rm /tmp/go.tar.gz
USER sandbox

ENV PATH="$PATH:/usr/local/go/bin"
ENV GOPATH="/home/sandbox/go"
