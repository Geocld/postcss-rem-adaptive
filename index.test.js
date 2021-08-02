const postcss = require('postcss')

const plugin = require('./')

async function run (input, output, opts = { }) {
  let result = await postcss([plugin(opts)]).process(input, { from: undefined })
  expect(result.css).toEqual(output)
  expect(result.warnings()).toHaveLength(0)
}


it('Simple', async () => {
  await run('a{ font-size: 20px; }', 'a{ font-size: 1rem; }', {
    remUnit: 20,
    autoRem: true
  })
})

it('no', async () => {
  await run('a{ font-size: 20px;/*no*/ }', 'a{ font-size: 20px; }', {
    remUnit: 20,
    autoRem: true
  })
})

