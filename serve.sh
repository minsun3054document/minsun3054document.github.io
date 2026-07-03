#!/bin/zsh
# 로컬 미리보기 서버 실행: ./serve.sh
# 종료: Ctrl+C
export PATH="/opt/anaconda3/envs/ms_homepage/bin:/opt/anaconda3/envs/ms_homepage/share/rubygems/bin:$PATH"
export GEM_HOME=/opt/anaconda3/envs/ms_homepage/share/rubygems
export GEM_PATH=$GEM_HOME
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8

cd "$(dirname "$0")"
bundle exec jekyll serve --baseurl "" --watch --livereload
