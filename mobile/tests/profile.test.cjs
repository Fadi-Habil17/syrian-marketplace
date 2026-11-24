const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'),
  vm = require('node:vm'),
  ts = require('typescript');
const exportsForTest = {};
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('mobile/src/profile-initials.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
  { exports: exportsForTest },
);
test('avatar uses the first and last name initials in English and Arabic', () => {
  assert.equal(exportsForTest.profileInitials('  Salem   Jaza  '), 'SJ');
  assert.equal(exportsForTest.profileInitials('ميس الريحان'), 'ما');
  assert.equal(exportsForTest.profileInitials('مُحَمَّد عَلي'), 'مع');
});
test('single-word and missing profile names still produce an avatar', () => {
  assert.equal(exportsForTest.profileInitials('salem'), 'SA');
  assert.equal(exportsForTest.profileInitials('س'), 'س');
  assert.equal(exportsForTest.profileInitials('  '), '?');
});
test('restoring a saved city loads its correct governorate and city center', async () => {
  const outputs = {},
    calls = [];
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync('mobile/src/location-choices.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    {
      exports: outputs,
      require: () => ({
        unwrap: (x) => x,
        api: {
          GET: async (path, options) => {
            calls.push({ path, options });
            if (path.endsWith('governorates')) return { items: [{ id: 'gov-a' }, { id: 'gov-b' }] };
            return {
              items:
                options.params.query.governorateId === 'gov-b'
                  ? [{ id: 'city-b', center: { latitude: 35, longitude: 37 } }]
                  : [],
            };
          },
        },
      }),
    },
  );
  const value = await outputs.locationChoices(undefined, 'city-b');
  assert.equal(value.selected, 'gov-b');
  assert.equal(value.cities[0].center.latitude, 35);
  calls.length = 0;
  await outputs.locationChoices('gov-b');
  assert.equal(calls.filter((call) => call.path.endsWith('cities')).length, 1);
  assert.equal(calls[1].options.params.query.governorateId, 'gov-b');
});
