# Aspect Deployment CloudFormation Template
This AWS CloudFormation Template allows you to create a new Aspect deployment

# How to Create a New Aspect Deployment
## Prerequisites
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
    
## Steps
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


