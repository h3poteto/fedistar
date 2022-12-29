const path = require('path')
const fs = require('fs')

const npmPath = path.join(__dirname, '../thirdparty.json')
const cargoPath = path.join(__dirname, '../src-tauri/thirdparty.json')
const outPath = path.join(__dirname, '../', 'src', 'thirdparty.json')

const npmData = JSON.parse(fs.readFileSync(npmPath))
const cargoData = JSON.parse(fs.readFileSync(cargoPath))

let cargo = cargoData.third_party_libraries.map(l => {
  return {
    package_name: l.package_name + '@' + l.package_version,
    license: l.license
  }
})

let npm = Object.keys(npmData).map(k => {
  let r = {
    package_name: k,
    license: npmData[k].licenses
  }
  if (npmData[k].publisher) {
    r = Object.assign(r, {
      publisher: npmData[k].publisher
    })
  }
  if (npmData[k].repository) {
    r = Object.assign(r, {
      repository: npmData[k].repository
    })
  }
  return r
})

fs.writeFileSync(outPath, JSON.stringify(cargo.concat(npm)))
