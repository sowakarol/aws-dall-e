import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as Infra from '../lib/infra-stack';

test('Should create lambda with node runtime and handler', () => {
  const app = new cdk.App();
    // when
  const stack = new Infra.InfraStack(app, 'InfraStack');
    // then
  const template = Template.fromStack(stack);

  template.hasResourceProperties("AWS::Lambda::Function", {
    Handler: "index.handler",
    Runtime: "nodejs18.x",
  });
});
