#!/bin/bash
docker run --rm -p 8090:8090 -p 8545:8545 -ti gsn-dev-server /start-relay-with-ganache.sh

