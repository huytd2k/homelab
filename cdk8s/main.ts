import * as kplus from 'cdk8s-plus-30';
import { Construct } from 'constructs';
import { App, Chart, ChartProps } from 'cdk8s';

export class CodeServer extends Chart {
  constructor(scope: Construct, id: string, props: ChartProps = {}) {
    super(scope, id, props);

    // Namespace definition
    const namespace = new kplus.Namespace(this, 'code-server-namespace', {
      metadata: {
        name: 'code-server-namespace',
      },
    });

    // Deployment for code-server
    const deployment = new kplus.Deployment(this, 'code-server', {
      metadata: {
        namespace: namespace.name, // Assign to the namespace
      },
      replicas: 1,
      containers: [
        {
          image: 'lscr.io/linuxserver/code-server:latest',
          securityContext: {
            readOnlyRootFilesystem: false,
            ensureNonRoot: false,
          },
          ports: [
            {
              number: 8443, // Expose container port 8443
            },
          ],
        },
      ],
    });

    // Service to expose code-server internally
    const service = new kplus.Service(this, 'code-server-service', {
      metadata: {
        namespace: namespace.name, // Assign to the namespace
      },
      type: kplus.ServiceType.CLUSTER_IP, // Internal service
      ports: [
        {
          port: 80, // Service port
          targetPort: 8443, // Target container port
        },
      ],
      selector: deployment,
    });

    // Ingress to expose code-server externally
    new kplus.Ingress(this, 'code-server-ingress', {
      metadata: {
        namespace: namespace.name, // Assign to the namespace
      },
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
