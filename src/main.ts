import * as core from '@actions/core'
import * as github from '@actions/github'
import {graphql} from '@octokit/graphql'

type Node = {
  name: string
}

type Releases = {
  repository: {
    releases: {
      nodes: Node[]
    }
  }
}
async function run(): Promise<void> {
  try {
    const inputs = {
      githubToken: core.getInput('github-token'),
      majorMinorVersion: core.getInput('major-minor-version')
    }

    core.debug(
      `Looking for releases that match ${inputs.majorMinorVersion} ...`
    ) // debug is only output if you set the secret `ACTIONS_STEP_DEBUG` to true

    //const octokit = github.getOctokit(inputs.githubToken)

    const query = `query Releases($owner: String!, $repo: String!) {
      repository(owner:$owner, name:$repo) {
        releases(last: 100, orderBy: {field: CREATED_AT, direction: DESC}) {
          nodes {
            name
          }
        }
      }
    }`

    const graphqlClient = graphql.defaults({
      headers: {
        authorization: `token ${inputs.githubToken}`
      }
    })

    const pulls = await graphqlClient<Releases>(query, github.context.repo)

    const matchingVersions = pulls.repository.releases.nodes.map(
      node => node.name
    )

    core.debug(`Releases: ${matchingVersions}`)

    core.info(`Releases: ${matchingVersions}`)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
