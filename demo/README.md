# ConfigServer配置（自动生成）

## QuickStart

生成配置

```bash
scripts/generate.sh
```

生成生产配置（生产指定secrets位置）

```bash
scripts/generate.sh ../prod-secrets
```

构建和推送config server web镜像

```bash
scripts/build.sh
```

构建和推送config server web镜像,指定标签

```bash
scripts/build.sh v1.0.0
```

自动发布（用于dev）
```bash
scripts/release.sh
```

本地启动webserver（调试用）

```bash
scripts/start.sh
```

## 模板

约定为`template`目录下，所有后缀为**j2**的文件，会原样保留template下的相对路径到最终生成的文件中，最终webserver的目录结构也会根据相对路径提供web服务

**如果模板最终渲染出的配置为空字符串（trim后），则不生成对应文件**

### values-map.yaml

根目录下的`values-map.yaml`用于匹配模板和环境变量，当`values-map.yaml`不存在或者该模板文件（.j2文件）匹配不到时，会仅采用`all.yaml`和`#{模板名}.yaml`的env，后者覆盖前者。（如果`#{模板名}.yaml`不存在也不影响，仅使用all）。

values-map.yaml匹配规则如下：

比如渲染模板文件`a/b/xxx-config.yaml.j2`，

1. 如果values-map.yaml如下：

```yaml
# 优先级如下
# a/b/xxx-config.yaml.j2
# a/b
# a
a/b/xxx-config.yaml.j2:
- all
- a
- b

a/b:
- all
- b

a:
- all
- b
```

模板文件`a/b/xxx-config.yaml.j2`会优先匹配相同的规则`a/b/xxx-config.yaml.j2`，然后按`all.yaml`、`a.yaml`、`b.yaml`的顺序从上到下合并env，后者覆盖前者。

2. 如果values-map.yaml如下：

```yaml
a/b:
- all
- b

a:
- all
- b
```

模板文件`a/b/xxx-config.yaml.j2`会优先匹配a/b规则，按`all.yaml`、`b.yaml`的顺序从上到下合并env，后者覆盖前者。

3. 如果values-map.yaml如下：

```yaml
b:
- all
- b
```
模板文件`a/b/xxx-config.yaml.j2`没有匹配任何规则，则按`all.yaml`、`xxx-config.yaml`合并env，后者覆盖前者。

## 环境变量

约定为`env`目录，一级目录为指定的环境,每个环境下必须有`all.yaml`，根据需要可以添加任意`.yaml`文件，通过values-map.yaml或模板名来匹配。覆盖规则见values-map.yaml的说明。

### salt

如果该环境目录下有文件`salt`，则说明打包镜像时，该环境的配置文件在拷进镜像前会被DES加密，通过webserver访问时需要在query中带上salt=#{秘钥}来请求配置文件。秘钥为`salt`文件的内容

## webserver

打包镜像时会内置一个简单的nodejs server，用于请求配置文件，请求路径为`GET /#{commit}/#{env}/#{file}`，其中`file`可以包含路径，比如`shunt/xxx-config.yaml`，可以为路径，比如`shunt`（会整个目录下载为zip，需要解压），如果文件为加密文件，则需要请求中带上salt=#{秘钥}

打包镜像时会自带之前版本的配置，保证每一个版本的配置都可以请求到。

## initContainer

用于现有应用的兼容，启动时从config-server下载对应版本的配置文件，yaml如下
```
initContainers:
- name: config-init
  image: xxx/app/config-init:latest
  env:
  - name: SALT # 默认不存在
    value: abcdddd
  - name: APP_ENV # 默认dev
    value: dev
  - name: OUTPUT # 默认为/etc/xxx
    value: /etc/xxx
  - name: COMMIT # 默认为latest，生产最好指定具体commit，避免配置加载错误 
    value: latest
```

## 项目目录结构

```bash
|- env # 变量
|  |- dev # 环境
|  |  |- all.yaml
|  |  |- a.yaml
|  |  |- b.yaml
|  |- prod-1
|  |  |- all.yaml
|  |  |- a.yaml
|  |  |- b.yaml
|  |  |- salt # 生产环境秘钥，打包到镜像的生产环境配置会通过DES加密放到镜像里，再通过config server的环境变量解密，如果没有salt则不会加密
|  |- prod-2
|  |  |- all.yaml
|  |  |- a.yaml
|  |  |- b.yaml
|  |- prod-3
|  |- prod-4
|- secrets # 加密变量，覆盖env
|  |- prod-1
|  |  |- all.yaml
|  |  |- salt # 生产环境秘钥，打包到镜像的生产环境配置会通过DES加密放到镜像里，再通过config server的环境变量解密，如果没有salt则不会加密
|  |- prod-2
|  |  |- all.yaml
|  |  |- salt # 生产环境秘钥，打包到镜像的生产环境配置会通过DES加密放到镜像里，再通过config server的环境变量解密，如果没有salt则不会加密
|  |- prod-3
|  |- prod-4
|
|- config # 由ci或本地脚本生成,1级目录对应上面env环境目录，2级目录对应template生成的模板
|  |- dev
|  |  |- app1
|  |  |  |- config1.yml
|  |  |  |- config2.yml
|  |  |- app2
|  |  |  |- app2-config.yml
|  |  |- xxx-config.yml
|  |- prod-1
|  |  |- app1
|  |  |  |- config1.yml
|  |  |  |- config2.yml
|  |  |- app2
|  |  |  |- app2-config.yml
|  |  |- xxx-config.yml
|  |- prod-2
|  |  |- app1
|  |  |  |- config1.yml
|  |  |  |- config2.yml
|  |  |- app2
|  |  |  |- app2-config.yml
|  |  |- xxx-config.yml
|  |- prod-3
|  |- prod-4
|
|- template
|  |- values-map.yaml # 每个模板如何聚合env,如果没有就是all.yaml+#{模板名}.yaml
|  |- app1
|  |  |- config1.yml.j2 # jinja2模板，只会解析j2结尾的模板，解析后会去掉.j2的后缀，所以最后输出的配置不一定是yml，可以根据模板自行编写
|  |  |- config2.yml.j2
|  |- app2
|  |  |- app2-config.yml.j2
|  |- xxx-config.yml.j2

```
