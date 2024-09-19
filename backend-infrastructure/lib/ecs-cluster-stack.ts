import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface EcsClusterStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
}

export class EcsClusterStack extends cdk.Stack {
  public readonly cluster: ecs.Cluster;

  constructor(scope: Construct, id: string, props: EcsClusterStackProps) {
    super(scope, id, props);

    this.cluster = new ecs.Cluster(this, 'LaundryServiceCluster', {
      vpc: props.vpc
    });

    new cdk.CfnOutput(this, 'EcsClusterName', { value: this.cluster.clusterName });
  }
}