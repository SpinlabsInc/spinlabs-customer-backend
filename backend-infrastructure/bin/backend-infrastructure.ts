#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LaundryServiceStack } from '../lib/backend-infrastructure-stack';

const app = new cdk.App();
new LaundryServiceStack(app, 'LaundryServiceStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
  },
});