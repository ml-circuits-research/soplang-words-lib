// A schema written in another notation, loaded unchanged.
//
// Suppose a system already describes its data with `field` wires whose id is
// <type>.<key>, and groups them in `package` wires that name what they need. Two
// core.schema.map wires tell the world how to read that notation; nothing is converted.

export const notation = `
@map.field core.schema.map from=field
    owner=id.prefix key=id.suffix
    value=is many=multi:yes required=must ask=prompt default=usually
@map.package core.schema.map from=package as=module name=name imports=needs
`;

export const packages = {
  base: `
@pkg.base package name=base

@base.person core.type
@base.person.name field is=string prompt="What is the name?"

@base.driver core.type extends=base.person
@base.driver.licence field is=atom
`,
  fleet: `
@pkg.fleet package name=fleet needs=base

@fleet.vehicle core.type closed=true note="Anything with a plate"
@fleet.vehicle.plate    field is=string must=true prompt="What is the plate?" example="B-01-XYZ"
@fleet.vehicle.driver   field is=$base.person
@fleet.vehicle.seats    field is=integer must=true prompt="How many seats?" audited=true
@fleet.vehicle.load     field is=quantity.mass
@fleet.vehicle.tag      field is=atom multi=yes
@fleet.vehicle.electric field is=boolean

@fleet.car core.type extends=fleet.vehicle closed=true
@fleet.truck core.type extends=fleet.vehicle closed=true
@fleet.truck.axles field is=integer
`,
};
