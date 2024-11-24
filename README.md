After setup k8s cluster, clone this repository, then:


### Set up github self host runner

```sh
cd bootstraps
export GITHUB_TOKEN=
cat github_runner_deployment.yaml | envsubst | kubectl apply -f -
```