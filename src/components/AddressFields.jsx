import { useCallback } from 'react'
import { regions, provinces, cities, barangays } from 'select-philippines-address'
import { useQuery } from '../hooks/useQuery'
import Feedback from './Feedback'
const empty = { regions: [], provinces: [], cities: [], barangays: [] }
export default function AddressFields({ value, onChange }) {
  const loader = useCallback(async () => {
    const allRegions = await regions()
    const region = allRegions.find(r => r.region_name === value.regionName)
    const allProvinces = region ? await provinces(region.region_code) : []
    const province = allProvinces.find(p => p.province_name === value.provinceName)
    const allCities = province ? await cities(province.province_code) : []
    const city = allCities.find(c => c.city_name === value.municipalityName)
    return { regions: allRegions, provinces: allProvinces, cities: allCities, barangays: city ? await barangays(city.city_code) : [] }
  }, [value.regionName, value.provinceName, value.municipalityName])
  const directory = useQuery(loader, empty)
  const fields = [
    ['regionName','Region',directory.data.regions,'region_name'],
    ['provinceName','Province',directory.data.provinces,'province_name'],
    ['municipalityName','City / Municipality',directory.data.cities,'city_name'],
    ['barangayName','Barangay',directory.data.barangays,'brgy_name'],
  ]
  function change(index, selected) {
    const changes = { [fields[index][0]]: selected }
    fields.slice(index + 1).forEach(([key]) => { changes[key] = '' })
    onChange(changes)
  }
  return <div className="space-y-3"><Feedback error={directory.error} onRetry={directory.refresh} />
    <div className="grid sm:grid-cols-2 gap-4">{fields.map(([key,label,options,nameKey],index) => <label key={key} className="text-sm font-semibold">{label}<select required value={value[key]} onChange={e=>change(index,e.target.value)} className="block w-full border border-slate-300 rounded-lg p-2 mt-1"><option value="">{directory.loading ? 'Loading...' : 'Select ' + label}</option>{options.map(item=><option key={item[nameKey]} value={item[nameKey]}>{item[nameKey]}</option>)}</select></label>)}</div>
  </div>
}
