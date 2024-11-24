import * as kplus from 'cdk8s-plus-30';
import { Construct } from 'constructs';
import { App, Chart, ChartProps } from 'cdk8s';

export class CodeServer extends Chart {
  constructor(scope: Construct, id: string, props: ChartProps = { }) {
    super(scope, id, props);

    new kplus.Deployment(this, 'code-server', {
      containers: [
        {
          image: 'lscr.io/linuxserver/code-server:latest',
          ports: [
            {
              number: 8080, // Container port
              hostPort: 8080, // Map to the host port
            },
          ],
        },
      ],
    });
  }
}

const app = new App();
new CodeServer(app, 'deployment');
app.synth();
