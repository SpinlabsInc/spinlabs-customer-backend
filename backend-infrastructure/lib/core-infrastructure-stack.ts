import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class CoreInfrastructureStack extends cdk.Stack {
  public readonly ecrRepository: ecr.Repository;
  public readonly ecsCluster: ecs.Cluster;
  public readonly vpc: ec2.Vpc;
  public readonly alb: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a VPC
    this.vpc = new ec2.Vpc(this, 'LaundryServiceVPC', {
      maxAzs: 2
    });

    // Create an ECR repository
    this.ecrRepository = new ecr.Repository(this, 'LaundryServiceRepo', {
      repositoryName: 'laundry-service-repo',
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Create an ECS cluster
    this.ecsCluster = new ecs.Cluster(this, 'LaundryServiceCluster', {
      vpc: this.vpc,
      clusterName: 'laundry-service-cluster'
    });

    // Create an Application Load Balancer
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'LaundryServiceALB', {
      vpc: this.vpc,
      internetFacing: true
    });

    // Create a security group for the ALB
    const albSg = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: this.vpc,
      allowAllOutbound: true,
      description: 'Security group for ALB'
    });
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));

    // Output the ECR repository URI
    new cdk.CfnOutput(this, 'ECRRepositoryUri', {
      value: this.ecrRepository.repositoryUri,
      description: 'ECR Repository URI'
    });

    // Output the ALB DNS name
    new cdk.CfnOutput(this, 'ALBDNSName', {
      value: this.alb.loadBalancerDnsName,
      description: 'ALB DNS Name'
    });
  }
}