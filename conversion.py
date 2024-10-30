def convert_vertex_format(line):
    components = line.strip().split()

    if components[0] == 'v':
        x, y, z = float(components[1]), float(components[2]), float(components[3])

        # Convert the format for vertices
        webgl_x = round(x / 10, 7)
        webgl_y = round(z / 10, 7)
        webgl_z = round(-y / 10, 7)

        return f"{webgl_x}, {webgl_y}, {webgl_z},"
    
    return None

def convert_normal_format(line):
    components = line.strip().split()

    if components[0] == 'vn':
        nx, ny, nz = float(components[1]), float(components[2]), float(components[3])

        # Convert the format for normals
        webgl_nx = round(nx, 7)
        webgl_ny = round(nz, 7)
        webgl_nz = round(-ny, 7)

        return f"{webgl_nx}, {webgl_ny}, {webgl_nz},"
    
    return None

def convert_vertices_file(input_file, output_vertices_file, output_normals_file):
    with open(input_file, 'r') as infile, open(output_vertices_file, 'w') as v_outfile, open(output_normals_file, 'w') as n_outfile:
        for line in infile:
            # Convert vertices
            converted_vertex = convert_vertex_format(line)
            if converted_vertex:
                v_outfile.write(converted_vertex + '\n')

            # Convert normals
            converted_normal = convert_normal_format(line)
            if converted_normal:
                n_outfile.write(converted_normal + '\n')

def convert_indices_format(line):
    components = line.strip().split()

    if components[0] == 'f':
        indices = [int(component.split('/')[0]) - 1 for component in components[1:]]

        if len(indices) == 3:
            webgl_first, webgl_second, webgl_third = indices
            return f"{webgl_first}, {webgl_second}, {webgl_third},"
        
        elif len(indices) == 4:
            webgl_first, webgl_second, webgl_third, webgl_fourth = indices
            return f"{webgl_first}, {webgl_second}, {webgl_third}, {webgl_first}, {webgl_third}, {webgl_fourth},"
    
    return None

def convert_indices_file(input_file, output_file):
    with open(input_file, 'r') as infile, open(output_file, 'w') as outfile:
        for line in infile:
            converted_line = convert_indices_format(line)
            if converted_line:
                outfile.write(converted_line + '\n')

# Specify your input and output file paths
input_file = 'vertices_and_normals.txt'
output_vertices_file = 'webgl_vertices.txt'
output_normals_file = 'webgl_normals.txt'

# Call the function to convert the vertices and normals
convert_vertices_file(input_file, output_vertices_file, output_normals_file)

inp = 'indices.txt'
out = 'webgl_indices.txt'
convert_indices_file(inp, out)
