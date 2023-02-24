export const githubRepoToVault = (repo: string) =>
    repo.replaceAll("https://github.com/", "").replaceAll("/", "-");