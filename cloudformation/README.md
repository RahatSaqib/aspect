# Aspect Deployment CloudFormation Template
## Summary
This AWS CloudFormation Template allows you to create a new Aspect deployment

It creates the following:
- An RDS instance for the deployment inside the Aspect VPC
- An Elastic Beanstalk Environment for the deployment inside the Aspect VPC
- A S3 Bucket to Host the Front End
- A CloudFront Distribution to Browse to the Front End Assets

## How to Create a New Aspect Deployment
### Prerequisites
- You must be on a machine that has mysql access to the AWS RDS instances (ie. your IP address must be white-listed in the rds-dev-db security group for MySQL/Aurora, port 3306)
- A working copy of the API and Web project (npm installed and tests passing)
- Usernames and passwords for the new database to be created
  - We will use the following in this example:
    - RDS Master Username: aspectmaster
    - RDS Master Password: fh7toYl8EAM3
    - RDS Application Username: aspectapi
    - RDS Application Password: 96loETfSyBSF6PLX
- Config settings for the new application
  - We will use the following in this example:
    - Deployment Name: malawi
- Config file for the deployment in Web project
  - We will use the following in this example:
    - web/src/config/malawi.js
- Database seed folder for the deployment in API project
  - We will use the following in this example:
    - api/seeds/malawi
- AWS and EB CLI Tools configured to use the SystemOne AWS credentials

### Steps
1. Login to the AWS web console and navigate to Services > CloudFormation
2. Click on Create Stack
3. Select Upload a template to Amazon S3, choose cloudformation/aspectdeployment.template and click Next
4. Specify a Stack name (such as malawi-aspect), enter the config values to be used and click Next
5. Click Next again, review the details and click Create
6. Wait for the new stack to be created (around 20 minutes)
7. Take note of the Outputs of the stack after it has been created
8. ##### Setup the Database
- 8.1. Navigate to the api folder in this project in the console
- 8.2. Create a file in this folder called .env and populate it with the following: (Replace database host, credentials and any occurrences of 'malawi')
```
secret=8rU7FITwHV30jhkcXvjOjoSvy2Tv2bZT

passwordAttempts=5
passwordSaltRounds=10

gxAlertApi=http://dev.gxalert.com/api

db.connectionLimit=100
db.host=<RDSHost from Step 7>
db.user=aspectmaster
db.password=fh7toYl8EAM3
db.databaseName=aspect
db.debug=false

seeds.directory='./seeds/malawi'

sendgrid.apiKey=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
email.fromAddress=support@gxalert.com

aspectUrl=http://malawi.aspect.id
```
- 8.3. Using the master username and password (entered in step 4) create an application user on the newly created database
- 8.4. Run `mysql -h <RDSHost from Step 7> -u aspectmaster -pfh7toYl8EAM3 -e"GRANT USAGE ON *.* TO 'aspectapi'@'%' IDENTIFIED BY '96loETfSyBSF6PLX';GRANT ALL PRIVILEGES ON aspect.* TO 'aspectapi'@'%';FLUSH PRIVILEGES;"`
- 8.5. Create database objects by running `yarn run knex migrate:latest`

9. ##### Seed the Database
- 9.1. Replace the database credentials in the .env file, created in step 8.2, with the Aspect application database credentials:
```
...
db.user=aspectapi
db.password=96loETfSyBSF6PLX
...
```
- 9.2. Seed the database with the data in api/seeds/malawi by running `yarn run knex seed:run`

10. ##### Deploy API to Elastic Beanstalk Environment
- 10.1. Initialise the deployment config by running `eb init`
  - Choose <b>us-east-1</b> for default region
  - Choose <b>aspect-api</b> for application
  - Choose the new environment created by the CloudFormation template
- 10.2. Deploy the application by running `eb deploy malawi-aspect-api`

11. ##### Deploy Front End Assets to S3
- 11.1. Navigate to the web folder in this project
- 11.2. Create front end bundle for this deployment by running `yarn run dist -- --deployment=malawi`
- 11.3. Upload the bundle assets to S3 by running `aws s3 cp dist s3://aspect-web-malawi --recursive`

12. Lastly, create the following records with the aspect.id DNS provider.  Use either A with an Alias Record Set (Route 53 specific) or CNAME records to the Beanstalk URL ([documentation](http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/customdomains.html)).
- [malawi.aspect.id]() pointing to the CloudFront distribution observed in Step 7
- [malawiapi.aspect.id]() pointing to the Elastic Beanstalk environment


# Update an existing Aspect installation

Make sure AWS CLI is installed and configured with your AWS credentials and EB CLI installed.


## Migrate database

Edit your `.env` file to use same as above or configure your `db.host`, `db.user`, `db.password` and `seeds.directory` then rollback, migrate and seed.

```bash
# Edit db connection and seed.directory in .env
npm run knex migrate:rollback
npm run knex migrate:latest
npm run knex seed:run
```

## Update API

Initialize elastic beanstalk configuration for Aspect API.

```bash
cd aspect/api
eb init -i

# Select us-east-1 region
# Select aspect-api application
# Select environment you wish to update
```

Deploy the update

```bash
eb deploy
```

## Update Web

Create new distribution and upload to S3

```bash
cd aspect/web
yarn run dist -- --deployment=malawi
aws s3 cp dist s3://aspect-web-malawi --recursive
```


# Troubleshooting

Some tips when things break.

## Database host

To find Database Host, navigate to RDS dashboard, click Instances and expand DB for your environment. The host is labeled "Endpoint".

## SSH Keypair

EC2 is configured with a single SSH key.  If you need to change it, navigate to EB dashboard, select Configuration, click Instance gear, select your key, click apply. This will allow `eb ssh` with that key.  NOTE: this will  setup a new EC2 instance and may take more than 20 minutes. If you simply need to add a new user, collect their public key and add to `~/.ssh/authorized_keys` as normal.

## Native Packages

Some native extensions and other libraries require YUM packages to be installed. You can usually determine missing packages by seeing errors on `npm install` in `eb logs`. Add required packages to `aspect/api/.ebextensions/aspect.config`
