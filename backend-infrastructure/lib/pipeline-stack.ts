import * as cdk from 'aws-cdk-lib';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';

interface PipelineStackProps extends cdk.StackProps {
  ecrRepoUri: string;
  service: ecs.FargateService;
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const buildProject = new codebuild.PipelineProject(this, 'LaundryServiceBuild', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        privileged: true
      },
      environmentVariables: {
        'ECR_REPO_URI': { value: props.ecrRepoUri }
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: [
              'echo Build started on `date`',
              'echo Building the Docker image...',
              'docker build -t $ECR_REPO_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION .',
              'docker tag $ECR_REPO_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION $ECR_REPO_URI:latest'
            ]
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              'echo Pushing the Docker image...',
              'docker push $ECR_REPO_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION',
              'docker push $ECR_REPO_URI:latest',
              'echo Writing image definitions file...',
              'printf \'[{"name":"laundry-service-container","imageUri":"%s"}]\' $ECR_REPO_URI:latest > imagedefinitions.json'
            ]
          }
        },
        artifacts: {
          files: ['imagedefinitions.json']
        }
      })
    });

    const pipeline = new codepipeline.Pipeline(this, 'LaundryServicePipeline', {
      pipelineName: 'LaundryServicePipeline'
    });

    // Source stage
    const sourceOutput = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'GitHub_Source',
      owner: 'your-github-username',
      repo: 'laundry-service',
      oauthToken: cdk.SecretValue.secretsManager('github-oauth-token'),
      output: sourceOutput,
      branch: 'main'
    });

    pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction],
    });

    // Build stage
    const buildOutput = new codepipeline.Artifact();
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'CodeBuild',
      project: buildProject,
      input: sourceOutput,
      outputs: [buildOutput],
    });

    pipeline.addStage({
      stageName: 'Build',
      actions: [buildAction],
    });

    // Deploy stage
    const deployAction = new codepipeline_actions.EcsDeployAction({
      actionName: 'ECSDeployAction',
      service: props.service,
      input: buildOutput
    });

    pipeline.addStage({
      stageName: 'Deploy',
      actions: [deployAction],
    });
  }
}