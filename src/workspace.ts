import { resolve, basename } from "path";
import { logger } from "./logger";

export class Workspace {

  public readonly rpath: string; // relative path
  public readonly envpath: string; // relative path
  public readonly templateFolderPath: string; // relative path
  public readonly secretsFolderPath?: string; // relative path

  public constructor(argv: any) {
    this.rpath = resolve(process.cwd(), argv.workspace);
    this.envpath = `${this.rpath}/env`;
    this.templateFolderPath = `${this.rpath}/template`;
    this.secretsFolderPath = argv.secrets ? `${this.rpath}/${argv.secrets}` : undefined;
    logger.info(`current workspace: ${this.rpath}`);
    logger.debug(`current envpath: ${this.envpath}`);
    logger.debug(`current templateFolderPath: ${this.templateFolderPath}`);
    logger.info(`current secretsFolderPath: ${this.secretsFolderPath}`);
  }
}