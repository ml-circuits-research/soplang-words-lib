#!/usr/bin/env python3
"""Reads DIMACS CNF on stdin, prints a SAT-competition style answer. Test helper built on PySAT."""
import sys
from pysat.formula import CNF
from pysat.solvers import Cadical153

cnf = CNF(from_string=sys.stdin.read())
with Cadical153(bootstrap_with=cnf.clauses) as solver:
    if solver.solve():
        print('s SATISFIABLE')
        print('v ' + ' '.join(map(str, solver.get_model())) + ' 0')
    else:
        print('s UNSATISFIABLE')
