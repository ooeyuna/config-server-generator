import { load } from "js-yaml";
import * as fs from "fs";
import { logger } from "./logger";

export function readYaml(path: string, allowNotExit?: boolean): any {
  try {
    logger.debug(`read file to yaml value, path: ${path}`);
    return load(fs.readFileSync(path, "utf8"));
  } catch (error) {
    const msg = `load file to yaml ${path} failed, error: ${error}`;
    if (allowNotExit) {
      logger.warn(msg);
    } else {
      logger.fatal(msg, error);
    }
  }

}

export function readFile(path: string, allowNotExit?: boolean): any {
  try {
    logger.debug(`read file to string, path: ${path}`);
    return fs.readFileSync(path, "utf8");
  } catch (error) {
    const msg = `read file ${path} failed, error: ${error}`;
    if (allowNotExit) {
      logger.warn(msg);
    } else {
      logger.fatal(msg, error);
    }
  }
}
