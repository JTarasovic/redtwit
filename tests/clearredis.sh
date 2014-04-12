#!/bin/bash
redis-cli keys 't3*' | xargs --delim='\n' redis-cli DEL
