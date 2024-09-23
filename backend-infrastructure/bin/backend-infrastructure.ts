import * as cdk from 'aws-cdk-lib';
import { CoreInfrastructureStack } from '../lib/core-infrastructure-stack';
import { EcsServiceStack } from '../lib/ecs-service-stack';
import { CICDPipelineStack } from '../lib/cicd-pipeline-stack';

const app = new cdk.App();

// Create the core infrastructure stack
const coreInfraStack = new CoreInfrastructureStack(app, 'CoreInfrastructureStack');

// Create the ECS service stack
const ecsServiceStack = new EcsServiceStack(app, 'EcsServiceStack', {
  cluster: coreInfraStack.ecsCluster,
  repository: coreInfraStack.ecrRepository,
});

// Create the CICD pipeline stack
new CICDPipelineStack(app, 'CICDPipelineStack', {
  ecrRepository: coreInfraStack.ecrRepository,
  ecsCluster: coreInfraStack.ecsCluster,
  ecsService: ecsServiceStack.service,
});

app.synth();