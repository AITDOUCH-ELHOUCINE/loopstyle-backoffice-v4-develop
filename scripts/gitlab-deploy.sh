# !/bin/bash
# Get servers list:
###########################################################################################
#                        Variables from GitLab server                                     #
# Note: They can’t have spaces!!                                                          #
# Command example: gitlab-deploy.sh server1.example.com,server2.example.com               #
###########################################################################################
SERVERS_STR=$1
SERVER_LIST=(${SERVERS_STR//,/ })
DEPLOY_PATH=$2

set — f

###########################################################################################
#                Iterate servers for deploy and pull last commit                          #
###########################################################################################
for i in "${!SERVER_LIST[@]}"; do
  echo "Deploy project on server ${SERVER_LIST[i]}"
   echo "Deployement path ${DEPLOY_PATH}"
  ssh  root@${SERVER_LIST[i]} << ENDSSH
cd "$DEPLOY_PATH"
# git config --global user.email "contact@flexiapps.com"
# git config --global user.name "FlexiAPPS"
git stash
git checkout -- .
git checkout $CI_BUILD_REF_NAME
git stash
git clean -f
git pull origin $CI_BUILD_REF_NAME
npm install --unsafe-perm
pm2 restart loopstyle-backend-v1
ENDSSH
done
echo "All is done perfectly"
