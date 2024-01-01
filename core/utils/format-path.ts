export function formatPath(path: string, params: unknown) {
  if(!Object.keys(params))
   return path; 

  let basePath = `${path}?`
  
  for (const param of Object.keys(params)){
    basePath += `${param}=${params[param]}&`
  }

  return basePath;
}

