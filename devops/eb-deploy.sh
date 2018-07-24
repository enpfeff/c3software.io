#!/usr/bin/env bash
set -e
# Usage:
#
# Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY env variables.
#
# Set AWS_REGION and BEANSTALK_APP env variables or add the following properties to you application.properties:
# aws.region=eu-west-1
# beanstalk.app=MyApp
#
# Optional settings, if you want to deploy to the same environment each time, set 'beanstalk.env':
# beanstalk.env=staging
#
# Optional settings, if you want to create a new environment for each version deployment (and use swap url mechanism to release your app), set any 'beanstalk.template':
# beanstalk.template=default
#
# Run ./aws-eb-deploy.sh
#

# AWS config
APPLICATION_PROPS_PATH="src/main/resources/application.properties"

if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    echo "AWS_ACCESS_KEY_ID env variable must be set"
    exit 1
fi
if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "AWS_SECRET_ACCESS_KEY env variable must be set"
    exit 1
fi
if [ -z "$AWS_REGION" ]; then
    AWS_REGION=`sed '/^\#/d' ${APPLICATION_PROPS_PATH} | grep 'aws.region'  | tail -n 1 | cut -d "=" -f2-`
    if [ -z "$AWS_REGION" ]; then
        echo "aws.region must be defined in application.properties or AWS_REGION env variable must be set"
        exit 1
    fi
fi


echo `pwd`
APP_NAME=`sed '/^\#/d' ${APPLICATION_PROPS_PATH} | grep 'app.name'  | tail -n 1 | cut -d "=" -f2-`
APP_VERSION=`sed '/^\#/d' ${APPLICATION_PROPS_PATH} | grep 'app.version'  | tail -n 1 | cut -d "=" -f2-`
WAR_FILE_NAME=${APP_NAME}-${APP_VERSION}.war
WAR_FILE_PATH="./build/libs/${WAR_FILE_NAME}"
if [ ! -f $WAR_FILE_PATH ]; then
    echo "War file not found in target directory, please run 'gradle assemble' first!"
    exit 1
fi

WAR_TIME=`date '+%Y.%m.%d--%H.%M.%S'`

# Beanstalk config
if [ -z "$BEANSTALK_APP" ]; then
    BEANSTALK_APP=`sed '/^\#/d' ${APPLICATION_PROPS_PATH} | grep 'beanstalk.app'  | tail -n 1 | cut -d "=" -f2-`
    if [ -z "$BEANSTALK_APP" ]; then
        echo "beanstalk.app must be defined in application.properties or BEANSTALK_APP env variable must be set"
        exit 1
    fi
fi

if [ -z "$BEANSTALK_ENV" ]; then
    BEANSTALK_ENV=`sed '/^\#/d' ${APPLICATION_PROPS_PATH} | grep 'beanstalk.env'  | tail -n 1 | cut -d "=" -f2-`
    if [ -z "$BEANSTALK_ENV" ]; then
        # Build beanstalk env name from app version
        BEANSTALK_ENV=`echo ${BEANSTALK_APP}-${APP_VERSION//./-}`
    fi
fi

# Build beanstalk version label
BEANSTALK_VERSION_LABEL=${APP_VERSION}-${WAR_TIME}

# Finding S3 bucket to upload WAR
S3_BUCKET=`aws elasticbeanstalk create-storage-location --region ${AWS_REGION} --output text`
S3_KEY=${APP_NAME}-${APP_VERSION}-${WAR_TIME}.war

# Upload to S3
echo "Uploading $WAR_FILE_NAME to S3..."
aws s3 cp ${WAR_FILE_PATH} s3://${S3_BUCKET}/${S3_KEY} --region ${AWS_REGION}

# Create application version
echo "Creating application version $BEANSTALK_VERSION_LABEL"
aws elasticbeanstalk create-application-version --application-name ${BEANSTALK_APP} --version-label ${BEANSTALK_VERSION_LABEL} --source-bundle S3Bucket=${S3_BUCKET},S3Key=${S3_KEY} --region ${AWS_REGION} --output table

# Check if environment exists
BEANSTALK_ENV_DESCRIPTION=`aws elasticbeanstalk describe-environments --environment-names ${BEANSTALK_ENV} --region ${AWS_REGION} --output text`

if [ -z "$BEANSTALK_ENV_DESCRIPTION" ];
then
    # Create environment
    BEANSTALK_ENV_TEMPLATE=`sed '/^\#/d' application.properties | grep 'beanstalk.template'  | tail -n 1 | cut -d "=" -f2-`
    if [ -z "$BEANSTALK_ENV_TEMPLATE" ]; then
        BEANSTALK_ENV_TEMPLATE=default
    fi
    echo "Creating environment $BEANSTALK_ENV with template $BEANSTALK_ENV_TEMPLATE"
    aws elasticbeanstalk create-environment --application-name ${BEANSTALK_APP} --environment-name ${BEANSTALK_ENV} --template-name ${BEANSTALK_ENV_TEMPLATE} --version-label ${BEANSTALK_VERSION_LABEL} --region ${AWS_REGION} --output table
else
    # Update environment
    echo "Updating environment $BEANSTALK_ENV"
    aws elasticbeanstalk update-environment --environment-name ${BEANSTALK_ENV} --version-label ${BEANSTALK_VERSION_LABEL} --region ${AWS_REGION} --output table
fi