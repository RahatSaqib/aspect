module.exports = plop => {
  const templatePath = 'scaffold-templates'
  const componentPath = process.env.INIT_CWD

  const addComponentIndex = {
    type: 'add',
    path: `${componentPath}/{{pascalCase name}}/index.jsx`,
    templateFile: `${templatePath}/components/component.js.hbs`,
  }

  const addComponentTest = {
    type: 'add',
    path: `${componentPath}/{{pascalCase name}}/tests/{{pascalCase name}}.test.js`,
    templateFile: `${templatePath}/components/component.test.js.hbs`,
  }

  const addComponentStory = {
    type: 'add',
    path: `${componentPath}/{{pascalCase name}}/stories/{{pascalCase name}}.stories.js`,
    templateFile: `${templatePath}/components/component.stories.js.hbs`,
  }

  plop.setGenerator('component', {
    description: 'Create a reusable component',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'What is your component name?',
      },
      {
        type: 'input',
        name: 'only',
        message: 'Which item do you want to create? [test, story, index]',
        default: 'all',
      },
    ],
    actions: ({ only }) => {
      const actions = []
      if (only.includes('test')) {
        actions.push(addComponentTest)
      }

      if (only.includes('story')) {
        actions.push(addComponentStory)
      }

      if (only.includes('index')) {
        actions.push(addComponentIndex)
      }

      if (only === 'all') {
        actions.push(addComponentIndex, addComponentTest, addComponentStory)
      }

      return actions
    },
  })
}
