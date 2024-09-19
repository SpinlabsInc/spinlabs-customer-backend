import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkStack } from './network-stack';
import { DatabaseStack } from './database-stack';
import { EcsClusterStack } from './ecs-cluster-stack';
import { ApplicationStack } from './application-stack';
import { PipelineStack } from './pipeline-stack';

export class LaundryServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const networkStack = new NetworkStack(this, 'NetworkStack');
    
    const databaseStack = new DatabaseStack(this, 'DatabaseStack');
    
    const ecsClusterStack = new EcsClusterStack(this, 'EcsClusterStack', {
      vpc: networkStack.vpc
    });
    
    const applicationStack = new ApplicationStack(this, 'ApplicationStack', {
      cluster: ecsClusterStack.cluster,
      usersTable: databaseStack.usersTable
    });
    
    new PipelineStack(this, 'PipelineStack', {
      ecrRepoUri: applicationStack.ecrRepoUri,
      service: applicationStack.service
    });
  }
}