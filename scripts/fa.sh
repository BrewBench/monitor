#!/bin/bash
cd "$(dirname "$0")"
GIT_COMMIT=$(git rev-parse --short HEAD)
echo "Commit $GIT_COMMIT"
sed -i -e 's/fa-book/fa-book-spells/g' ../build/views/header.html
sed -i -e 's/use\.fontawesome\.com/pro\.fontawesome\.com/g' ../build/index.html
sed -i -e 's/Font\ Awesome\ 5\ Free/Font\ Awesome\ 5\ Pro/g' ../build/styles/app.css
sed -i -e "s/git_commit/$GIT_COMMIT/g" ../build/views/footer.html
