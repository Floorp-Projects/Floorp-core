import "./firefox/index";
import { Components_Interfaces } from "./firefox/index";

declare namespace MockedExports {
  interface Ci {
    nsISafeOutputStream: Components_Interfaces["nsISafeOutputStream"];
  }
  interface KnownModules {
    "resource://gre/modules/FileUtils.sys.mjs": IFileUtils;
  }
}

export interface IFileUtils {
  MODE_RDONLY: number;
  MODE_WRONLY: number;
  MODE_RDWR: number;
  MODE_CREATE: number;
  MODE_APPEND: number;
  MODE_TRUNCATE: number;

  PERMS_FILE: number;
  PERMS_DIRECTORY: number;
  /**
   * Gets a file at the specified hierarchy under a nsIDirectoryService key.
   * @param   key
   *          The Directory Service Key to start from
   * @param   pathArray
   *          An array of path components to locate beneath the directory
   *          specified by |key|. The last item in this array must be the
   *          leaf name of a file.
   * @return  nsIFile object for the file specified. The file is NOT created
   *          if it does not exist, however all required directories along
   *          the way are if pathArray has more than one item.
   */
  getFile: (key: any, pathArray: any) => any;
  /**
   * Gets a directory at the specified hierarchy under a nsIDirectoryService
   * key.
   * @param   key
   *          The Directory Service Key to start from
   * @param   pathArray
   *          An array of path components to locate beneath the directory
   *          specified by |key|
   * @param   shouldCreate
   *          true if the directory hierarchy specified in |pathArray|
   *          should be created if it does not exist, false otherwise.
   * @return  nsIFile object for the location specified.
   */
  getDir: (key, pathArray, shouldCreate) => any;
  /**
   * Opens a file output stream for writing.
   * @param   file
   *          The file to write to.
   * @param   modeFlags
   *          (optional) File open flags. Can be undefined.
   * @returns nsIFileOutputStream to write to.
   * @note The stream is initialized with the DEFER_OPEN behavior flag.
   *       See nsIFileOutputStream.
   */
  openFileOutputStream: (file, modeFlags) => any;
  /**
   * Opens an atomic file output stream for writing.
   * @param   file
   *          The file to write to.
   * @param   modeFlags
   *          (optional) File open flags. Can be undefined.
   * @returns nsIFileOutputStream to write to.
   * @note The stream is initialized with the DEFER_OPEN behavior flag.
   *       See nsIFileOutputStream.
   *       OpeanAtomicFileOutputStream is generally better than openSafeFileOutputStream
   *       baecause flushing is not needed in most of the issues.
   */
  openAtomicFileOutputStream: (file, modeFlags) => any;
  /**
   * Opens a safe file output stream for writing.
   * @param   file
   *          The file to write to.
   * @param   modeFlags
   *          (optional) File open flags. Can be undefined.
   * @returns nsIFileOutputStream to write to.
   * @note The stream is initialized with the DEFER_OPEN behavior flag.
   *       See nsIFileOutputStream.
   */
  openSafeFileOutputStream: (file, modeFlags) => any;

  _initFileOutputStream: (fos, file, modeFlags) => any;
  /**
   * Closes an atomic file output stream.
   * @param   stream
   *          The stream to close.
   */

  closeAtomicFileOutputStream: <
    Stream extends Components_Interfaces["nsISafeOutputStream"] & any,
  >(
    stream: Stream
  ) => void;
  /**
   * Closes a safe file output stream.
   * @param   stream
   *          The stream to close.
   */
  closeSafeFileOutputStream: <
    Stream extends Components_Interfaces["nsISafeOutputStream"] & any,
  >(
    stream: Stream
  ) => void;
  File: any;
}

declare module "resource://gre/modules/FileUtils.sys.mjs" {
  const FileUtils: IFileUtils;
  export { FileUtils };
}

//TODO: add to window
interface MozXULElement {
  /**
   * Allows eager deterministic construction of XUL elements with XBL attached, by
   * parsing an element tree and returning a DOM fragment to be inserted in the
   * document before any of the inner elements is referenced by JavaScript.
   *
   * This process is required instead of calling the createElement method directly
   * because bindings get attached when:
   *
   * 1. the node gets a layout frame constructed, or
   * 2. the node gets its JavaScript reflector created, if it's in the document,
   *
   * whichever happens first. The createElement method would return a JavaScript
   * reflector, but the element wouldn't be in the document, so the node wouldn't
   * get XBL attached. After that point, even if the node is inserted into a
   * document, it won't get XBL attached until either the frame is constructed or
   * the reflector is garbage collected and the element is touched again.
   *
   * @param {string} str
   *        String with the XML representation of XUL elements.
   * @param {string[]} [entities]
   *        An array of DTD URLs containing entity definitions.
   *
   * @return {DocumentFragment} `DocumentFragment` instance containing
   *         the corresponding element tree, including element nodes
   *         but excluding any text node.
   */
  parseXULToFragment: (str: string, entities: string[]) => DocumentFragment;
}
