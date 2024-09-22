// import * as cdk from 'aws-cdk-lib';
// import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
// import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
// import * as codebuild from 'aws-cdk-lib/aws-codebuild';
// import * as ecr from 'aws-cdk-lib/aws-ecr';
// import * as ecs from 'aws-cdk-lib/aws-ecs';
// import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
// import { Construct } from 'constructs';

// interface CICDPipelineStackProps extends cdk.StackProps {
//   ecrRepository: ecr.Repository;
//   ecsCluster: ecs.Cluster;
//   ecsService: ecs.FargateService;
// }

// export class CICDPipelineStack extends cdk.Stack {
//   constructor(scope: Construct, id: string, props: CICDPipelineStackProps) {
//     super(scope, id, props);

//     // Fetch the GitHub token secret from Secrets Manager
//     const githubToken = secretsmanager.Secret.fromSecretNameV2(this, 'GithubToken', 'GithubToken').secretValueFromJson('GithubToken');

//     // Create a CodeBuild project
//     const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
//       environment: {
//         buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
//         privileged: true,
//       },
//       environmentVariables: {
//         ECR_REPO_URI: { value: props.ecrRepository.repositoryUri },
//       },
//       buildSpec: codebuild.BuildSpec.fromObject({
//         version: '0.2',
//         phases: {
//           install: {
//             'runtime-versions': {
//               python: 3.9,
//             },
//             commands: [
//               'cd Services',
//               'pip install --upgrade pip',
//               'pip install -r requirements.txt',
//             ],
//           },
//           build: {
//             commands: [
//               'pytest',
//               'docker build -t $ECR_REPO_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION .',
//               'docker push $ECR_REPO_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION',
//             ],
//           },
//         },
//         artifacts: {
//           files: ['imageDetail.json']
//         },
//       }),
//     });

//     // Grant permissions to push to ECR
//     props.ecrRepository.grantPullPush(buildProject.role!);

//     // Create a CodePipeline
//     const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
//       pipelineName: 'LaundryServicePipeline',
//       crossAccountKeys: false,
//     });

//     // Source stage
//     const sourceOutput = new codepipeline.Artifact();
//     const sourceAction = new codepipeline_actions.GitHubSourceAction({
//       actionName: 'GitHub_Source',
//       owner: 'SpinlabsInc', // Make sure this matches your GitHub organization name
//       repo: 'spinlabs-customer-backend',
//       oauthToken: githubToken,  // Correctly using the GitHubToken field from Secrets Manager
//       output: sourceOutput,
//       branch: 'main',
//     });

//     pipeline.addStage({
//       stageName: 'Source',
//       actions: [sourceAction],
//     });

//     // Build stage
//     const buildOutput = new codepipeline.Artifact();
//     const buildAction = new codepipeline_actions.CodeBuildAction({
//       actionName: 'Build',
//       project: buildProject,
//       input: sourceOutput,
//       outputs: [buildOutput],
//     });

//     pipeline.addStage({
//       stageName: 'Build',
//       actions: [buildAction],
//     });

//     // Manual approval stage
//     const approvalAction = new codepipeline_actions.ManualApprovalAction({
//       actionName: 'Approve',
//     });

//     pipeline.addStage({
//       stageName: 'Approve',
//       actions: [approvalAction],
//     });

//     // Deploy stage
//     const deployAction = new codepipeline_actions.EcsDeployAction({
//       actionName: 'DeployToECS',
//       service: props.ecsService,
//       imageFile: buildOutput.atPath('imageDetail.json'),
//     });

//     pipeline.addStage({
//       stageName: 'Deploy',
//       actions: [deployAction],
//     });
//   }
// }
import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface CICDPipelineStackProps extends cdk.StackProps {
  ecrRepository: ecr.Repository;
  ecsCluster: ecs.Cluster;
  ecsService: ecs.FargateService;
}

export class CICDPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CICDPipelineStackProps) {
    super(scope, id, props);

    // Fetch the GitHub token secret from Secrets Manager
    const githubToken = secretsmanager.Secret.fromSecretNameV2(this, 'GithubToken', 'GithubToken').secretValueFromJson('GithubToken');

    // Create a CodeBuild project for testing
    const testProject = new codebuild.PipelineProject(this, 'TestProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              python: 3.9,
            },
            commands: [
              'cd Services',
              'pip install --upgrade pip',
              'pip install -r requirements.txt',
            ],
          },
          build: {
            commands: [
              'pytest', // Run tests as a separate phase
            ],
          },
        },
      }),
    });

    // Create a CodeBuild project for building and pushing Docker image to ECR
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        privileged: true, // For Docker
      },
      environmentVariables: {
        ECR_REPO_URI: { value: props.ecrRepository.repositoryUri },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: [
              'docker build -t $ECR_REPO_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION .',
              'docker push $ECR_REPO_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION',
            ],
          },
        },
        artifacts: {
          files: ['imageDetail.json'],
        },
      }),
    });

    // Grant permissions to push to ECR
    props.ecrRepository.grantPullPush(buildProject.role!);

    // Create a CodePipeline
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: 'LaundryServicePipeline',
      crossAccountKeys: false,
    });

    // Source stage
    const sourceOutput = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'GitHub_Source',
      owner: 'SpinlabsInc',
      repo: 'spinlabs-customer-backend',
      oauthToken: githubToken,
      output: sourceOutput,
      branch: 'main', // This can be 'develop' for the dev environment
    });

    pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction],
    });

    // Test stage
    const testOutput = new codepipeline.Artifact();
    const testAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Test',
      project: testProject,
      input: sourceOutput,
      outputs: [testOutput],
    });

    pipeline.addStage({
      stageName: 'Test',
      actions: [testAction],
    });

    // Build stage
    const buildOutput = new codepipeline.Artifact();
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Build',
      project: buildProject,
      input: sourceOutput,
      outputs: [buildOutput],
    });

    pipeline.addStage({
      stageName: 'Build',
      actions: [buildAction],
    });

    // Manual approval stage
    const approvalAction = new codepipeline_actions.ManualApprovalAction({
      actionName: 'Approve',
    });

    pipeline.addStage({
      stageName: 'Approve',
      actions: [approvalAction],
    });

    // Deploy stage
    const deployAction = new codepipeline_actions.EcsDeployAction({
      actionName: 'DeployToECS',
      service: props.ecsService,
      imageFile: buildOutput.atPath('imageDetail.json'),
    });

    pipeline.addStage({
      stageName: 'Deploy',
      actions: [deployAction],
    });
  }
}
