import { pickBy, cloneDeep, fromPairs } from 'lodash'
import { embeddedFiles } from '../../util/files'
import { makeDataURI } from '../../util/dataURI'
import { makeScript } from './script.js'
import { makeHTML } from './html.js'

// TODO: At some later point, header options
// should be derived from the study state
// to the greatest possible extent (i.e. via plugins).

const assemble = (state,
  stateModifier=state => state,
  { additionalFiles={}, headerOptions }={}
) => {
  // Apply modification function to copy of current state
  const updatedState = stateModifier(cloneDeep(state))

  // Filter files that are not embedded in components
  const filesInUse = embeddedFiles(updatedState.components)

  const files = pickBy(
    updatedState.files.files,
    (file, filename) =>
      file.source !== 'embedded' ||
      filesInUse.includes(filename)
  )

  // Reassemble state object that now includes the generated script,
  // as well as any additional files required for the deployment target
  return {
    files: {
      // Static files stored in state
      ...files,
      // Additional files injected by the export modifier
      ...additionalFiles,
      // Generated experiment files
      'script.js': {
        content: makeDataURI(
          makeScript(updatedState),
          'application/javascript',
        )
      },
      'index.html': {
        content: makeDataURI(
          makeHTML(updatedState, headerOptions),
          'text/html'
        )
      },
    },
    bundledFiles: fromPairs(Object.entries(updatedState.files.bundledFiles).map(
      // Add source path to data, so that bundled files can be moved
      ([path, data]) => [path, { source: path, ...data }]
    ))
  }
}

export default assemble
