import * as core from '@actions/core'
import * as github from '@actions/github'
import { graphql } from '@octokit/graphql'
import semver from 'semver'

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
    )

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

    const releases = await graphqlClient<Releases>(query, github.context.repo)

    const matchingVersions = releases.repository.releases.nodes.filter(node => semver.satisfies(node.name, `${inputs.majorMinorVersion}.x`)).map(
      node => node.name
    ).sort(semver.compare)

    const nextVersion = (matchingVersions.length == 0) ? `${inputs.majorMinorVersion}.0` : semver.inc(matchingVersions[0], "patch")

    core.debug(`Releases: ${nextVersion}`)

    core.info(`Releases: ${nextVersion}`)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
