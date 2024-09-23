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

//     // Source action: GitHub as source
//     const sourceOutput = new codepipeline.Artifact();
//     const sourceAction = new codepipeline_actions.GitHubSourceAction({
//       actionName: 'GitHub_Source',
//       owner: 'SpinlabsInc', // Your GitHub org
//       repo: 'spinlabs-customer-backend', // Your GitHub repo
//       oauthToken: githubToken,  // Token from Secrets Manager
//       output: sourceOutput,
//       branch: 'main', // or 'develop'
//     });

//     // Build project: Running tests and building Docker image
//     const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
//         environment: {
//           buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
//           privileged: true,
//         },
//         environmentVariables: {
//           ECR_REPO_URI: { value: props.ecrRepository.repositoryUri },
//         },
//         buildSpec: codebuild.BuildSpec.fromObject({
//           version: '0.2',
//           phases: {
//             install: {
//               'runtime-versions': {
//                 python: 3.9,
//               },
//               commands: [
//                 'cd Services',
//                 'pip install --upgrade pip',
//                 'pip install -r requirements.txt',
//               ],
//             },
//             pre_build: {
//               commands: [
//                 // Set PYTHONPATH to include the src directory
//                 'export PYTHONPATH=$PYTHONPATH:$(pwd)/src',
//                 'pytest',  // Ensure tests are run after setting the PYTHONPATH
//               ],
//             },
//             build: {
//               commands: [
//                 // Docker build and push
//                 'docker build -t $ECR_REPO_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION .',
//                 'docker push $ECR_REPO_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION',
//                 'printf \'{"ImageURI":"%s"}\' $ECR_REPO_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION > imageDetail.json',
//               ],
//             },
//           },
//           artifacts: {
//             files: ['imageDetail.json'],
//           },
//         }),
//       });
      
//     // Grant permissions to CodeBuild to push to ECR
//     props.ecrRepository.grantPullPush(buildProject.role!);

//     // Deploy action: Deploy to ECS using Docker image from ECR
//     const deployAction = new codepipeline_actions.EcsDeployAction({
//       actionName: 'DeployToECS',
//       service: props.ecsService,
//       imageFile: new codepipeline.ArtifactPath(sourceOutput, 'imageDetail.json'), // Ensure the correct path for the image artifact
//     });

//     // Create CodePipeline
//     const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
//       pipelineName: 'LaundryServicePipeline',
//       crossAccountKeys: false,
//       stages: [
//         {
//           stageName: 'Source',
//           actions: [sourceAction],
//         },
//         {
//           stageName: 'Build',
//           actions: [new codepipeline_actions.CodeBuildAction({
//             actionName: 'Build',
//             project: buildProject,
//             input: sourceOutput,
//             outputs: [sourceOutput],  // Make sure the output includes the artifact
//           })],
//         },
//         {
//           stageName: 'Deploy',
//           actions: [deployAction],
//         },
//       ],
//     });
//   }
// }
import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
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

    const githubToken = secretsmanager.Secret.fromSecretNameV2(this, 'GithubToken', 'GithubToken').secretValueFromJson('GithubToken');

    const sourceOutput = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'GitHub_Source',
      owner: 'SpinlabsInc',
      repo: 'spinlabs-customer-backend',
      oauthToken: githubToken,
      output: sourceOutput,
      branch: 'main', // or 'develop' depending on your workflow
    });

    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        privileged: true,
      },
      environmentVariables: {
        ECR_REPO_URI: { value: props.ecrRepository.repositoryUri },
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec.yml'),
    });

    // Grant permissions to the build project
    props.ecrRepository.grantPullPush(buildProject.role!);
    buildProject.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:GetRepositoryPolicy",
        "ecr:DescribeRepositories",
        "ecr:ListImages",
        "ecr:DescribeImages",
        "ecr:BatchGetImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:PutImage"
      ],
      resources: ['*'],
    }));

    const buildOutput = new codepipeline.Artifact();
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Build',
      project: buildProject,
      input: sourceOutput,
      outputs: [buildOutput],
    });

    const deployAction = new codepipeline_actions.EcsDeployAction({
      actionName: 'DeployToECS',
      service: props.ecsService,
      imageFile: buildOutput.atPath('imageDetail.json'),
    });

    new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: 'LaundryServicePipeline',
      stages: [
        {
          stageName: 'Source',
          actions: [sourceAction],
        },
        {
          stageName: 'Build',
          actions: [buildAction],
        },
        {
          stageName: 'Deploy',
          actions: [deployAction],
        },
      ],
    });
  }
}