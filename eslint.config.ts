import { felixicaza } from '@felixicaza/eslint-config'

export default felixicaza(
  {
    packageJson: {
      publishable: true
    }
  },
  [
    {
      files: ['**/*.css'],
      rules: {
        'css/no-invalid-properties': ['error', { allowUnknownVariables: true }]
      }
    }
  ]
)
