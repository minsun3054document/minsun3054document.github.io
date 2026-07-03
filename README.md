# Personal Website

개인 홈페이지 소스입니다. [Jekyll](https://jekyllrb.com/) 기반이며 GitHub Pages(`https://minsun3054document.github.io`)로 배포합니다.
템플릿: [msaveski/www_personal](https://github.com/msaveski/www_personal)

## 로컬 실행 (conda 환경)

```bash
conda activate ms_homepage
export PATH="/opt/anaconda3/envs/ms_homepage/bin:$PATH"
bundle install
bundle exec jekyll serve --baseurl ""
# http://127.0.0.1:4000 접속
```

## 내용 수정

| 파일 | 내용 |
|---|---|
| `_data/main_info.yaml` | 이름, 직함, 이메일, 소셜 링크, 프로필 사진 |
| `_data/experience.yaml` | 학력/경력 타임라인 |
| `_data/publications.yaml` | 논문 목록 |
| `index.html` | Bio 문단 |
| `assets/profile-pics/profile.jpg` | 프로필 사진 |
| `assets/cv/cv_web.pdf` | CV PDF |
