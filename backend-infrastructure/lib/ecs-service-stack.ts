// import * as cdk from 'aws-cdk-lib';
// import * as ecs from 'aws-cdk-lib/aws-ecs';
// import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
// import * as ecr from 'aws-cdk-lib/aws-ecr';
// import { Construct } from 'constructs';

// interface EcsServiceStackProps extends cdk.StackProps {
//   cluster: ecs.ICluster;
//   repository: ecr.IRepository;
// }

// export class EcsServiceStack extends cdk.Stack {
//   public readonly service: ecs.FargateService;

//   constructor(scope: Construct, id: string, props: EcsServiceStackProps) {
//     super(scope, id, props);

//     const loadBalancedFargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'LaundryService', {
//       cluster: props.cluster,
//       cpu: 256,
//       memoryLimitMiB: 512,
//       desiredCount: 1,
//       taskImageOptions: {
//         image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'), // Placeholder image
//         containerPort: 80,
//       },
//       publicLoadBalancer: true,
//     });

//     this.service = loadBalancedFargateService.service;

//     // Output the service name for use in GitHub Actions
//     new cdk.CfnOutput(this, 'EcsServiceName', {
//       value: this.service.serviceName,
//       description: 'Name of the ECS Service',
//     });
//   }
// }
import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

interface EcsServiceStackProps extends cdk.StackProps {
  cluster: ecs.ICluster;
  repository: ecr.IRepository;
}

export class EcsServiceStack extends cdk.Stack {
  public readonly service: ecs.FargateService;

  constructor(scope: Construct, id: string, props: EcsServiceStackProps) {
    super(scope, id, props);

    const loadBalancedFargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'LaundryService', {
      cluster: props.cluster,
      cpu: 256,
      memoryLimitMiB: 512,
      desiredCount: 1,
      taskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(props.repository), // Use ECR repository image
        containerPort: 80,
      },
      publicLoadBalancer: true,
    });

    this.service = loadBalancedFargateService.service;

    // Output the service name for use in GitHub Actions
    new cdk.CfnOutput(this, 'EcsServiceName', {
      value: this.service.serviceName,
      description: 'Name of the ECS Service',
    });
  }
}
