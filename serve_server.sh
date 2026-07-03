#!/bin/bash
# 서버에서 로컬 미리보기: ./serve_server.sh  (종료: Ctrl+C)
# Mac 브라우저에서 http://163.152.161.51:4000 으로 접속
export PATH="$HOME/.conda/envs/ms_homepage/bin:$HOME/.conda/envs/ms_homepage/share/rubygems/bin:$PATH"
export GEM_HOME=$HOME/.conda/envs/ms_homepage/share/rubygems
export GEM_PATH=$GEM_HOME
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
cd "$(dirname "$0")"
bundle exec jekyll serve --baseurl "" --host 0.0.0.0 --watch
