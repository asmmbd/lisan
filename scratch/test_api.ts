async function testApis() {
  const baseUrl = 'http://localhost:3000'
  
  console.log('Testing /api/categories...')
  try {
    const res = await fetch(`${baseUrl}/api/categories`)
    console.log('Status:', res.status)
    const data = await res.json()
    console.log('Categories count:', data.categories?.length)
    console.log('Sets count:', data.sets?.length)
  } catch (err: any) {
    console.log('Error /api/categories:', err.message)
  }

  console.log('\nTesting /api/vocabulary...')
  try {
    const res = await fetch(`${baseUrl}/api/vocabulary`)
    console.log('Status:', res.status)
    const data = await res.json()
    console.log('Vocabulary count:', data.vocabulary?.length)
  } catch (err: any) {
    console.log('Error /api/vocabulary:', err.message)
  }
}

testApis()
