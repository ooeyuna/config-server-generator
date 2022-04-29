import { logger } from "./logger";
import deepmerge = require("deepmerge");
import { readFile, readYaml } from "./utils";
import * as shelljs from "shelljs";
import { Workspace } from "./workspace";

const searchValues = (path: string, values: any): any => {
  const paths = path.split("/");
  if (paths.length === 1 || values[path]) {
    logger.debug(`path: ${path} find values, values[path]: ${values[path]}`);
    return values[path];
  } else {
    logger.debug(`path: ${path} cannot find values, search next`);
    return searchValues(paths.slice(0, -1).join("/"), values);
  }
};

export class ValueMaps {

  private readonly templateDir: string;

  public constructor(templateDir: string) {
    this.templateDir = templateDir;
    logger.debug(`init value maps: (templateDir: ${templateDir})`);
  }

  public parse(): any {
    const templateList = shelljs
      .find(`${this.templateDir}`)
      .filter((file: string) => { return file.match(/\.j2$/); });
    let values: any;
    values = readYaml(`${this.templateDir}/values-map.yaml`, true, 0);
    if (!values) {
      logger.info(`Cannot find ${this.templateDir}/values-map.yaml, only use all.yaml and #{template_name}.yaml`);
      values = {};
    }
    // find到的路径都可以作为一级key
    // 不考虑windows
    return templateList.reduce((prev: any, path) => {
      const value = searchValues(path, values);
      prev[path] = value ? value : ["all", path.split("/").slice(-2, -1)];
      return prev;
    }, {} as any);
  }

  public parseWithTemplateFolderPath(path: string): string[] {
    let values: any;
    values = readYaml(`${this.templateDir}/values-map.yaml`, true, 0);
    if (!values) {
      logger.info(`Cannot find ${this.templateDir}/values-map.yaml, only use all.yaml and #{template_name}.yaml`);
      values = {};
    }
    return searchValues(path, values);
  }
}


export class EnvMerger {

  public readonly env: string;
  private readonly ws: Workspace;
  private readonly secretPath?: string;
  private readonly envPath: string;
  public readonly salt?: string;

  public constructor(ws: Workspace, env: string) {
    this.env = env;
    this.envPath = `${ws.envpath}/${env}`;
    logger.debug(`current env merger: (workspacePath: ${ws.rpath}, env: ${env}, secretPath: ${ws.secretsFolderPath})`);
    if (ws.secretsFolderPath) {
      const saltPath = `${ws.secretsFolderPath}/${env}/salt`;
      this.salt = readFile(saltPath, true, 0);
      if (this.salt) {
        this.secretPath = `${ws.secretsFolderPath}/${env}`;
        logger.debug(`find salt at ${this.secretPath}`);
      } else {
        logger.info(`Cannot find salt at ${saltPath}, ignore all >>${env}<< secrets`);
      }
    }
  }

  public merge(apps?: string[]): any {
    // 从后往前覆盖, secrets为最后一层
    logger.debug(`>>${this.env}<< env merge input params: (apps: ${apps})`);
    if (!apps) {
      logger.info(`>>${this.env}<< cannot find env_maps or template value-maps.yaml, only output all.yaml`);
      apps = ["all"];
    }
    let data = this.read(apps, this.envPath);
    if (this.secretPath) {
      logger.debug(`find secrets, use secrets override`);
      const secrets = this.read(apps, this.secretPath);
      if (secrets) {
        data = deepmerge(data, secrets);
      }
    }
    return data;
  }

  private read(apps: string[], path: string): any {
    return apps.map((app: string): any => {
      return readYaml(`${path}/${app}.yaml`, true, 0);
    })
      .filter(item => item)
      .reduce((prev, curr) => {
        return deepmerge(prev, curr);
      }, {});
  }
}