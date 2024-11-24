import * as kplus from 'cdk8s-plus-30';
import { Construct } from 'constructs';
import { App, Chart, ChartProps } from 'cdk8s';

export class CodeServer extends Chart {
  constructor(scope: Construct, id: string, props: ChartProps = {}) {
    super(scope, id, props);

    // Deployment for code-server
    const deployment = new kplus.Deployment(this, 'code-server', {
      replicas: 1,
      containers: [
        {
          image: 'lscr.io/linuxserver/code-server:latest',
          securityContext: {
            readOnlyRootFilesystem: false,
            ensureNonRoot: false
          },
          ports: [
            {
              number: 8443, // Expose continer port 8080
            },
          ],
        },
      ],
    });

    // Service to expose code-server internally
    const service = new kplus.Service(this, 'code-server-service', {
      type: kplus.ServiceType.CLUSTER_IP, // Internal service
      ports: [
        {
          port: 80,        // Service port
          targetPort: 8443, // Target container port
        },
      ],
      selector: deployment,
    });

    // Ingress to expose code-server externally
    new kplus.Ingress(this, 'code-server-ingress', {
      rules: [
        {
          host: 'code-server.local', // Set desired host
          path: '/',
          backend: kplus.IngressBackend.fromService(service),
        },
      ],
    });
  }
}

const app = new App();
new CodeServer(app, 'my-home-lab');
app.synth();
