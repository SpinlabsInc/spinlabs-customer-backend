import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

import { Construct } from 'constructs';

interface ApplicationStackProps extends cdk.StackProps {
  cluster: ecs.ICluster;
  usersTable: dynamodb.ITable;
}

export class ApplicationStack extends cdk.Stack {
  public readonly service: ecs.FargateService;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly ecrRepoUri: string;

  constructor(scope: Construct, id: string, props: ApplicationStackProps) {
    super(scope, id, props);

    const ecrRepo = new ecr.Repository(this, 'LaundryServiceECRRepo', {
      repositoryName: 'laundry-service-ecr-repo'
    });
    this.ecrRepoUri = ecrRepo.repositoryUri;
    
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'LaundryServiceTaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    const container = taskDefinition.addContainer('LaundryServiceContainer', {
      image: ecs.ContainerImage.fromEcrRepository(ecrRepo),
      memoryLimitMiB: 512,
    });

    container.addPortMappings({ containerPort: 80 });

    // Grant the ECS task role access to the DynamoDB table
    props.usersTable.grantReadWriteData(taskDefinition.taskRole);

    this.service = new ecs.FargateService(this, 'LaundryService', {
      cluster: props.cluster,
      taskDefinition,
      desiredCount: 1,
    });

    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'LaundryServiceLB', {
      vpc: props.cluster.vpc,
      internetFacing: true
    });

    const listener = this.loadBalancer.addListener('Listener', { port: 80 });

    listener.addTargets('ECS', {
      port: 80,
      targets: [this.service]
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', { value: this.loadBalancer.loadBalancerDnsName });
    new cdk.CfnOutput(this, 'EcrRepoUri', { value: ecrRepo.repositoryUri });
  }
}