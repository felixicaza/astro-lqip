import { felixicaza } from '@felixicaza/eslint-config'

export default felixicaza(
  {
    pnpm: true,
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
